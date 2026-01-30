Pulsar searching is conceptually a simple process – the detection of dispersed pulses in noisy data. The first pulsars were discovered serendipitously by visual inspection of the total power output from a radio telescope (Hewish et al. 1968). However, only a small fraction of the 1700 pulsars currently known are strong enough to be discovered via their individual pulses. The vast majority of known pulsars, and most that still await discovery, are faint objects which require sensitive telescopes and innovative techniques to reveal their periodic nature. From the discussion in Chapters 1 and 2, the motivation for probing deeper into this population is to discover exotic pulsars (e.g. those in binary systems) and to better characterise the Galactic distribution and evolution of neutron stars.

Since the early days of pulsar astronomy, a lot of effort has gone into developing sophisticated algorithms to maximise the sensitivity and efficiency of the pulsar search process. A summary of most of the resulting techniques we explore in this Chapter is presented in Figure 6.1. We begin by describing the main components of the ‘standard’ frequency domain radio pulsar search procedure which involves de-dispersion, Fourier transformation and candidate selection. We then move on to extensions of this approach to searches for short-period binary pulsars. Searches in the time domain are becoming increasingly popular; we discuss the fastfolding algorithm and single-pulse searches in this context. Virtually all searches of radio data now need to combat the ever-increasing levels of interference present; we discuss briefly time- and frequency-domain mitigation techniques. We conclude with an overview of tried and tested strategies required to optimise a search for the various types of pulsars.

### 6.1 Standard search procedure

Resample time series Have an idea, devise survey, write observing proposal, get observing time and collect data Yes

Multi−channel            De−disperse     Acceleration           FFT and         FFT and search data....         and barycentre     search?      No   harmonic sums   harmonic sums

Yes                                     No

No Another DM?                Single−pulse      FFA                Examine         Another analysis                           spectrum       acceleration? Yes No

Examine all candidates             Save any       Save any             Save any        Save any at best P and DM                candidates     candidates           candidates      candidates

Fig. 6.1. Flow diagram summarising the main steps in a pulsar search and the most commonly used algorithms. Frequency domain acceleration searches and radio frequency excision techniques are not shown here (for clarity) but are described in detail in Sections 6.2.2 and 6.4, respectively.

![Fig. 6.1](/book/ch6/fig-6-1.png)

We begin by describing the most commonly used procedure to find a periodic signal of unknown pulse period and dispersion measure (DM). The data are first de-dispersed to form a number of time series spanning a wide range of trial DM values. Each time series then can be independently searched for the presence of periodic signals. The standard procedure is to Fourier transform the time series and search the resulting amplitude or power spectra for significant features. The best candidates from the analysis are saved and the whole process is repeated for another trial DM. After processing all of the time series in this way, a list of pulsar candidates is compiled and the de-dispersed data are folded modulo each candidate period for further inspection.

#### 6.1.1 The de-dispersion stage
Now we expand on these steps in detail, beginning with a description of the basic algorithms for dispersion removal, optimal choice of trial DM step and an efficient de-dispersion scheme.

##### 6.1.1.1 Simple de-dispersion
Considering the raw data as a two-dimensional array of time samples and frequency channels, we write the j th time sample of the lth frequency channel as Rjl . For nchans frequency channels, the j th sample of the

de-dispersed time series, Tj , is then 

$$
T_j = \sum_{l=1}^{n_{\mathrm{chans}}} R_{j+k(l),l}\tag{6.1}
$$

$$
k(l) = \left(\frac{t_{\mathrm{samp}}}{4.15\times 10^6\,\mathrm{ms}}\right)^{-1}\left(\frac{\mathrm{DM}}{\mathrm{cm}^{-3}\,\mathrm{pc}}\right)\left[\left(\frac{f_l}{\mathrm{MHz}}\right)^{-2}-\left(\frac{f_1}{\mathrm{MHz}}\right)^{-2}\right]\tag{6.2}
$$

Here we have assumed that the channel ordering in R starts at the highest frequency ($l = 1$) and proceeds in descending frequency order. The channel frequencies are therefore given by

$$
f_l = f_1 - (l-1)\,\Delta f_{\mathrm{chans}}\tag{6.3}
$$

where ∆fchans is the channel bandwidth.

##### 6.1.1.2 Choice of dispersion step size
$$
W_{\mathrm{eff}} = \sqrt{W_{\mathrm{int}}^2 + \left(k_{\mathrm{DM}}\,|\Delta\mathrm{DM}|\,\Delta f/f^3\right)^2}\tag{6.4}
$$

where $k_{DM} = 8.3\times 10^6$ ms if pulse widths are measured in ms and, as usual, DM is in units of cm−3 pc and the bandwidth ∆f and centre frequency f are in MHz. In Appendix 1, we derive the observing sensitivity to pulse signals. Ignoring constant system-dependent factors in

$$
\mathrm{S/N} \propto \sqrt{\frac{P - W_{\mathrm{eff}}}{W_{\mathrm{eff}}}}\tag{6.5}
$$

Fig. 6.2. Relative S/N as a function of trial DM for a hypothetical data acquisition system spanning an 8 MHz band centred at 430 MHz. Each curve corresponds to a different pulse period as indicated. In each case the true DM value is assumed to be 50 cm−3 pc and the intrinsic pulse duty cycle (Wint /P ) is assumed to be 5 per cent. Effects of scattering and dispersion across filterbank channels are assumed to be negligible.

![Fig. 6.2](/book/ch6/fig-6-2.png)

A sensible choice of DM step is to set the delay between the highest and lowest frequency channels equal to the data sampling interval. Again, starting with the dispersion relation, the ith DM value can be written in terms of the total bandwidth ∆f (MHz), centre frequency f

(MHz) and sampling time tsamp (ms) as

$$
\mathrm{DM}_i = 1.205\times 10^{-7}\,\mathrm{cm}^{-3}\,\mathrm{pc}\,(i-1)\,t_{\mathrm{samp}}\,(f^3/\Delta f)\tag{6.6}
$$

The case $i = 1$ corresponds to the ‘zero DM’ time series – simply combining all the frequency channels without any time delays. This time series is used primarily to identify sources of interference (see Section 6.4). When $i = n_{\mathrm{chans}} + 1$, the so-called ‘diagonal DM’ value is reached. At this DM, the total delay across the band is equal to nchans × tsamp and the broadening across an individual frequency channel is equal to tsamp . Above the diagonal DM the effective time resolution starts to become dominated by the broadening in the individual channels. Usually when $i = 2n_{\mathrm{chans}}$ or $i = 3n_{\mathrm{chans}}$ , adjacent time samples are added together so that the rest of the processing requires fewer computations. Since dispersion broadening is now the dominant effect, halving the effective time resolution does not impact on the sensitivity to short-period pulsars. The entire process now can be repeated on the new coarser data to produce time series with higher dispersion measures out beyond the now higher value of the diagonal DM until the desired DM limit is reached. Typically, we expect DMs in excess of 1000 cm−3 pc for surveys along the Galactic plane and ∼  < 50 cm−3 pc for high Galactic latitudes. As

a general rule, we recommend using a reasonable model of the electron density distribution (see, for example, Section 4.4) to estimate the maximum DM for the lines of sight sampled by the survey and multiply this by a factor of two to account for uncertainties in the electron density model.

##### 6.1.1.3 Tree de-dispersion
The simple de-dispersion process described above is rather computationally expensive, since it requires n2chans floating-point operations to de-disperse every nchans time samples. Inspired by the fast-folding algorithm developed by Staelin (1969); (see Section 6.3.1), Taylor (1974) proposed a more efficient de-dispersion scheme known as the ‘tree algorithm’. As shown in Figure 6.3, the tree algorithm derives its name from the fact that it can be built from successively smaller components which all start from simple two-channel ‘branches’. For example, a four-channel tree can be built from a pair of two-channel branches; an eight-channel tree derives from two four-channel branches etc. As a result, the tree algorithm requires a base-two number of frequency channels.

Fig. 6.3. Taylor’s tree algorithm for de-dispersion showing the eight-channel case. Figure provided by Bernd Klein.

![Fig. 6.3](/book/ch6/fig-6-3.png)


ment a tree algorithm. Benchmarking brute-force de-dispersion schemes against tree de-dispersion is often advisable during the planning phases of a pulsar survey.

#### 6.1.2 Barycentric correction for long time series
Most radio pulsar search data are of relatively short (< 30 min) duration. Over this time, the effects of the rotation of the Earth and its motion around the Sun can be safely ignored. For deep radio searches (see Sections 6.5.4 and 6.5.5), and searches at X-ray and γ-ray wavelengths carried out with orbiting satellites, the relative motion between the observatory and the target becomes important and should be corrected prior to attempting a periodicity search. As for pulsar timing applications (see Chapter 8) the standard approach is to refer the observed (topocentric) data collected at the telescope to the solar system barycentre (SSB) which, to a very good approximation, is an inertial reference frame. To transform a topocentric time series to the SSB, first we must delay or advance the start time of the observation, tstart , appropriately to match the arrival time of the first sample at the SSB, tstart,SSB . This is identical to the correction applied to pulse arrival times described in detail in Chapter 8. The arrival time of subsequent samples then needs to be monitored so that it does not differ significantly from the expected arrival time at the SSB. Specifically, we compare the arrival time of the ith sample $t_i = t_{\mathrm{start,SSB}} + (i - 1) t_{\mathrm{samp}}$ with the arrival time corrected for the relative motion between the observatory and the SSB: $\tau_i = t_{\mathrm{start,SSB}} + (i - 1) t_{\mathrm{samp,SSB}}$ . The corrected sampling time tsamp,SSB is a variable quantity due to the continually changing relative motion and can be calculated using a pulsar timing program such as TEMPO (see Chapter 8). The correction then proceeds by adding or subtracting whole samples from the time series so that $|\tau_i - t_i| < t_{\mathrm{samp}}$ . Added samples are usually chosen to be the mean value of the time series.

#### 6.1.3 Periodicity searches using the Fourier transform
Given a de-dispersed time series Tj that, if necessary, has been appropriately barycentred, we need an algorithm to search it for the presence of periodic signals. One of the most efficient and widely used techniques is to take the Fourier transform of the time series and examine the Fourier

(frequency) domain. In the following subsections, we review the salient properties of Fourier transform for pulsar searching.

##### 6.1.3.1 The discrete Fourier transform
$$
F_k = \sum_{j=0}^{N-1} T_j\,\exp\left(-2\pi i j k/N\right)\tag{6.7}
$$

$$
F_{N-k} = (F_k)^*\tag{6.8}
$$

where the asterisk denotes the complex conjugate. This redundancy can be exploited (see, for example, Press et al. (1992)) to calculate the DFT of two N -point real data sets simultaneously, or a single data set of length N/2.

##### 6.1.3.2 Searching for periodic signals in the Fourier domain
Displaying either the amplitudes ($A_k = |F_k|$) or powers ($P_k = |F_k|^2$ ) of the Fourier components as a function of frequency is an extremely sensitive means of revealing a periodic signal. This is illustrated in Figure 6.4, in which we have sampled a 25 Hz sine wave in the presence of purely Gaussian noise with a standard deviation that is 3 times the amplitude of the signal. As a result, the sinusoidal signal is essentially undetectable by examining the time domain. The ‘power spectrum’ in the Fourier domain, however, shows a clearly visible line at 25 Hz.

Fig. 6.4. (a) A noisy time series containing a 25 Hz signal; (b) the power spectrum of the DFT of this time series (i.e. |Fk |2 as a function of k). The dashed line shows the detection threshold based on the number of independent estimates of spectral power; (c) an expanded view of the spectrum showing the DFT response to a 25.125 Hz signal in which the effects of scalloping reduce the power by about 60 per cent; (d) recovery of the power by Fourier interpolation (see text).

![Fig. 6.4](/book/ch6/fig-6-4.png)

One limitation of the DFT is that its frequency response is not uniform and is in fact only ideal for signals that match exactly the centre frequencies of the Fourier bins. As mentioned above, each bin in the frequency domain is characterised by its central frequency $\nu_k = k/T$

$$
F_r = F_k\,\mathrm{sinc}[\pi(k-r)]\tag{6.9}
$$

$$
\pi F_{k+1/2} \simeq (F_k - F_{k+1}),\quad P_{k+1/2}=|F_{k+1/2}|^2\tag{6.11}
$$

$$
P_k = \max\left(\frac{|F_{k-1}+F_k|^2}{2},\ |F_k|^2,\ \frac{|F_k+F_{k+1}|^2}{2}\right)\tag{6.12}
$$

##### 6.1.3.3 Removing low-frequency noise
Our example time series and its Fourier transform in Figure 6.4 assumed purely Gaussian noise. The Fourier spectrum of Gaussian noise is ‘white’, i.e. the Fourier power is distributed uniformly over the entire frequency range. Well-behaved white noise is ideal, because the estimation of the significance level of any signal is relatively simple (see below). Although time series obtained from real pulsar search data closely resemble Gaussian noise, fluctuations in the receiver and/or data acquisition systems often manifest themselves via a significant low-frequency or ‘red noise’ component when viewed in the Fourier domain. An example of this is shown in Figure 6.5.

(a)                                  (b)

Fig. 6.5. (a) Amplitude spectrum from data collected using the Parkes telescope. (b) Spectrum after a whitening procedure has been applied to remove the red noise component. The whitened spectrum then has been normalised so that it has a zero mean and unit root mean square (see text).

![Fig. 6.5](/book/ch6/fig-6-5.png)

Before attempting to estimate significance levels of any signal present in these data, it is standard practice to whiten the spectrum so that the response to noise is as uniform as possible. The most common technique in use is to break the spectrum up into a number of contiguous pieces, calculating the mean and root mean square value for each one. Care must be taken at this stage to avoid biasing the mean and root mean square values from outlying points, and often the median is used rather than the mean. Subtracting a running median and normalising the local root mean square will result in the whitened spectrum having a zero mean and unit root mean square. With this normalisation scheme, the S/N ratio of any spectral feature is simply its amplitude.

##### 6.1.3.4 Increasing sensitivity to narrow pulses
Our discussion so far has considered purely sinusoidal signals that appear in the Fourier domain as a single line at the fundamental frequency of the sinusoid. In reality, however, the pulsed signals we are trying to detect have a duty cycle (i.e. the pulse width divided by the period) that is typically only a few per cent. In the Fourier domain, the power from such a narrow pulse is distributed between the fundamental frequency and a significant number of harmonics. In order to estimate the number of harmonics present, consider the time series as a train of top hat pulses of width W spaced by the pulse period P . In the time domain, this can be viewed as a single top hat function convolved with a train of delta functions separated by P (i.e. the Shah or comb function). In the Fourier domain (see, for example, Bracewell (1998)) this convolution is just the product of the Fourier transforms of the two functions. The Fourier transform of the top hat is proportional to sinc(πf W ), that has a first null when the Fourier frequency $f = 1/W$ . The Shah function Fourier transforms to another Shah function with spacing of 1/P . The resulting Fourier transform of our pulse train is simply a series of delta functions harmonically spaced by 1/P with amplitudes that are bounded by the envelope of the sinc function. Taking the extent of the harmonics as being roughly the width of the sinc envelope to its first null, the number of harmonics is roughly P/W , i.e. the reciprocal of the pulse duty cycle. For typical pulse duty cycles of order 5 per cent, the expected number of harmonics is of order 20, as shown in the example spectrum for PSR B2303+30 (Figure 6.6(a)). In order to take full advantage of the power contained in these harmonics, a technique known as ‘incoherent harmonic summing’, first devised by Taylor and Huguenin (1969), is

(a) original

(b) stretched x 2 Power

(c) summed

Frequency (Hz)

Fig. 6.6. The process of harmonic summing illustrated in the power spectrum of an observation of PSR B2303+30 collected with the Ooty radio telescope at 327 MHz (see text for further details). Figure provided by Dipankar Bhattacharya.

![Fig. 6.6](/book/ch6/fig-6-6.png)

used. In the example shown in Figure 6.6, the lower half of the original spectrum is stretched by a factor of 2 (Figure 6.6(b)) and then added to the original unstretched spectrum. As a result, all second harmonics are added to their corresponding fundamentals. Although this summation  √ process increases the noise in the folded spectrum by a factor of 2, the amplitudes of two harmonics add directly. For    √two harmonics of roughly equal power, the net gain in S/N is of order 2. By repeating this process several times, and taking care to add in odd-numbered harmonics, the S/N to a narrow duty cycle pulse increases significantly. A good illustration of the improvement gained by harmonic summing is shown in Figure 6.7 which is the result of an analysis assuming idealised pulses described by Ransom et al. (2002). This shows the various duty cycle regimes in which harmonic summing is effective. While the single harmonic sensitivity is adequate for duty cycles wider than 30 per cent, it is clear for narrower pulses that the harmonic summing schemes are essential in order to retain full sensitivity. Most pulsar search codes produce a total of five spectra that are searched independently: the spectrum of the DFT itself, and four subsequent harmonically folded versions which contain the sum of the first two, four, eight, and sixteen

Sensitivity gain over a single−harmonic search

8                    Op tim al su mm 4                                     ing

2 harmonics

1 harmonic

Pulsation duty cycle or fractional FWHM

Fig. 6.7. An illustration of the gain in sensitivity due to harmonic summing (thin curves) over a single-harmonic DFT analysis (horizontal line) as a function of pulse duty cycle. The thick solid line shows the optimal harmonic sum. Figure and analysis provided by Scott Ransom.

![Fig. 6.7](/book/ch6/fig-6-7.png)

harmonics, respectively. As Figure 6.7 shows, this choice guarantees that most of the range of pulse duty cycles are searched with optimal sensitivity. However, for duty cycles less than 2 per cent, some improvement in sensitivity can be made by summing up to thirty-two harmonics.

##### 6.1.3.5 False-alarm probabilities and S/N ratios
In order to calculate the significance of signals in the Fourier domain, we need to know the response of the DFT to random noise. In the ideal case1 for a time series containing pure Gaussian noise, the probability 1 As discussed earlier, in reality the noise does not follow strictly a Gaussian distribution. Also, the Fourier interpolation discussed above means that the amplitude

density function (PDF) of the real and imaginary parts of the Fourier components also follow a Gaussian PDF. In the spectral analysis, we deal either with Fourier power (the sum of the squares of the real and imaginary components) or the amplitude (square root of the power). In general, the sum of the squares of n independent variables with Gaussian PDFs is the $\chi^2$ distribution with n degrees of freedom. In our case, where $n = 2$, the powers follow an exponential PDF that can be integrated easily to show that the probability that the power in an individual bin Pk exceeds some threshold Pmin is simply proportional to exp(−Pmin ). This is sometimes called the false-alarm probability, i.e. the chance of a candidate being the result of noise fluctuations rather than a real event. For the single harmonic shown in Figure 6.4(b), the normalised power level is ∼ 40. The corresponding false-alarm probability $p_{\mathrm{false}} = \exp(-40)$ ≃ 4 × 10−18 ! For the more general case, in which harmonic folding has been performed m times, the PDF follows a $\chi^2$ distribution with $2m$ degrees of freedom. The corresponding false-alarm probability can be written as

$$
p_{\mathrm{false}}(P>P_{\min}) = \sum_{j=0}^{m-1}\frac{P_{\min}^j}{j!}\,\exp(-P_{\min})\tag{6.13}
$$

Here, it is assumed that the powers have been normalised by the factor N Tj2 where, as before, N is the number of samples in the time series Tj (see, for example, Ransom et al. (2002)). We can estimate a reasonable detection threshold for any given search based on the false-alarm probability of a single event and the number of trials. For the sinusoidal signal in Figure 6.4, the number of points in the time series is 1024, resulting in 512 separate samples of power in the Fourier domain. The expected number of false alarms above a given power threshold Pmin is simply 512 exp(−Pmin ). Setting this number to be less than one event, it follows that $P_{\min} = -\ln(1/512)$ ≃ 6.2. This threshold power level is shown by the dashed line in Figure 6.4(b). For analyses that work with Fourier amplitudes (A) rather than powers, it is more common to quote S/N thresholds. Since S/N values are calculated from the Fourier amplitudes by subtracting a mean value (A) and dividing by the local root mean square (σA ) the false-alarm proba-

and power values are not strictly independent quantities. Fortunately, the departure from a $\chi^2$ distribution due to these effects is small and can be ignored safely.

$$
p_{\mathrm{false}}(\mathrm{S/N}>\mathrm{S/N}_{\min}) = \exp\left(-[\sigma_A\,\mathrm{S/N}_{\min}+A]^2\right)\tag{6.14}
$$

##### 6.1.3.6 Reconstructed profiles
No use of the phase information in the Fourier components is made when forming amplitude or power spectra. This information can be used to eliminate ‘signals’ from the harmonic summing analysis that result from random superposition of noise features. Unlike the harmonics produced by a train of pulses, random superposition will result in a random phase relationship between the ‘harmonics’. This can be tested by taking the inverse DFT of the harmonics to form a pulse profile. To ensure that this ‘reconstructed profile’ is entirely real, the DFT is doubled in size to include the complex conjugates of each harmonic used. If the Fourier components are truly phase related, this ‘reconstructed’ profile should have a S/N in the time domain that is comparable to the spectral S/N. A spurious candidate often will show up at this stage with a profile that has a much reduced S/N.

##### 6.1.3.7 Two-dimensional Fourier analysis
The procedure discussed so far is essentially a one-dimensional Fourier analysis that repeats on different de-dispersed time series. An alterna-

tive approach is to consider the raw data as a two-dimensional array of time samples and frequency channels. The two-dimensional Fourier transform of such an array is the space of fluctuation frequency and dispersion delay. A dispersed periodic signal plotted in this phase space appears as a set of harmonically spaced dots in a graph of delay versus frequency. The slope of the dots is proportional to the dispersion measure. Interpolating along lines of constant dispersion measure then would produce amplitude or power spectra that can be analysed with the harmonic summing techniques described above. Although this method has been implemented (see, for example, Camilo et al. (1996)), and is in principle more computationally efficient than the one-dimensional approach, the simplicity of brute-force one-dimensional de-dispersion and Fourier transforms usually is preferred.

##### 6.1.3.8 Discontinuities in the time series
The techniques outlined so far assume the time series to be continuous. Unforeseen interruptions in the observation (e.g. due to parking of the telescope in high winds or power outages) can result in a number of discontinuous time series. While these data can be analysed separately, the ideal solution is to perform a coherent Fourier transform over the entire observation. This is achieved by appropriately zero padding the missing time samples.

#### 6.1.4 Candidate selection
The result of all the de-dispersion and Fourier transform stages described above is a list of candidate periods and S/N ratios for all harmonic folds and DMs. A real pulsar usually will appear many times in this list at a variety of S/N values, with the maximum ideally being at the DM that is closest to the true DM value. At this stage, the standard practice is to de-disperse and fold the raw data at the candidate period and DM, and produce diagnostic plots for visual inspection. The details of the folding process are discussed in Chapter 7. A typical pulsar candidate is shown in Figure 6.8. This example is the original discovery observation of PSR J1842–0415, one of four pulsars discovered in a search using the 100 m Effelsberg radio telescope (Lorimer et al. 2000). The integrated profile (top left) has a well defined narrow pulse that appears consistently throughout the integration (bottom left) and in all frequency channels (bottom right). The S/N of the integrated profile should compare well with the S/N in the amplitude or

### 6.2 Searches for pulsars in binary systems

Fig. 6.8. Sample search code output for PSR J1842–0415, the first pulsar discovered using the Effelsberg telescope. See text for further details.

![Fig. 6.8](/book/ch6/fig-6-8.png)

power spectrum and (if calculated) the reconstructed S/N. In addition to the folded profiles, perhaps the most useful diagnostic is S/N versus trial DM shown on the top right as a clear peak at a non-zero DM. As we showed in Section 6.1.1 and Figure 6.2, every pulsar produces a characteristic shape in the S/N–DM plane that depends primarily on the pulse width, period, observing frequency and bandwidth. Good agreement between the observed and theoretical S/N–DM responses is an essential test that any viable pulsar candidate should pass.

Although the Fourier transform is extremely good at finding periodic signals, as noted by a number of authors (see, for example, Middleditch and Priedhorsky (1986) and Johnston and Kulkarni (1991)), the frequency domain analyses discussed above have reduced sensitivity to pulsars in short-period binary systems. The effect of binary motion is to cause a change in the apparent pulse frequency during the integration, spreading the emitted signal power over a number of neighbouring Fourier

bins. As a result, the sharpness of the spectral features and, hence, the S/N ratio and sensitivity of the search are reduced significantly. All is not lost, however, since there are now a number of techniques in use to compensate for, and in some cases fully recover, the loss of sensitivity due to binary motion. These techniques described below generally work optimally under certain conditions and often demand significant computational resources.

#### 6.2.1 Time domain resampling
$$
\tau(t) = \tau_0\left(1+\frac{V_l(t)}{c}\right)\tag{6.16}
$$

For the purposes of a blind search, in which the orbital parameters are a priori unknown, assuming a Keplerian model for Vl (t) would require a five-dimensional search of all the parameter space. In practice, computing requirements demand a simpler solution. Although dropping orbital eccentricity and longitude of periastron would allow a three-dimensional search for circular orbit binaries, the simplest model is to assume a constant orbital acceleration al during the integration, i.e. $V_l(t) = a_l t$. The so-called ‘acceleration search’ then can be carried out on time series corrected assuming different trial values of al in order to cover a region of acceleration space.

(a)                                 (b)

Fig. 6.9. (a) Folded pulse profiles as a function of time for a 22 min Arecibo observation of PSR B1913+16 showing the effects of a changing apparent pulse period. (b) The same time series now folded assuming $a_l = -16\,\mathrm{m\,s}^{-2}$ .

![Fig. 6.9](/book/ch6/fig-6-9.png)

An example of the improvement from the use of an acceleration search is shown in Figure 6.9 for a 22 min observation of the original binary pulsar B1913+16. Although the pulsar is strong enough to be detectable in the observation without any acceleration searching, folding the data at the nominal period from the search results in the heavily smeared profile shown on the left. A search in acceleration space shows a much stronger detection at al ∼ −16 ms−2 . Folding the acceleration-corrected time series as shown on the right effectively has removed the deleterious

$$
N_{\mathrm{drift}} = \dot{\nu}T/\Delta\nu = a_l\,\nu_0\,T^2/c\tag{6.17}
$$

#### 6.2.2 Frequency-domain techniques
For relatively small numbers of samples (< 223 ), time domain acceleration searches have been used to good effect to search for pulsars in globular clusters (see, for example, Anderson (1992) and Camilo et al. (2000b)). For longer data sets, however, the need to FFT repeatedly after each correction to the time series means that the computational time becomes dominated by FFTs that are very similar to one another. A more efficient approach developed by Ransom et al. (2002) is to work entirely in the frequency domain so that only one FFT need be carried out per DM trial.

##### 6.2.2.1 Correlation method
The response of the DFT to a signal of varying frequency can be thought of as the idealised response to a stationary signal convolved with a finite impulse response (FIR) filter which spreads the power over a number of spectral bins. In a similar manner to coherent de-dispersion (Chapter 5)

$$
F_{r_0} = \sum_{k=r_0-m/2}^{r_0+m/2} F_k\,F^*_{r_0-k}\tag{6.18}
$$

The exact form of the template Fr∗0 −k is a phase rotation term and a set of Fresnel integrals which are functions of the centre frequency bin r0 and its derivative ṙ. Calculating this template for a range of ṙ values is equivalent to the time domain acceleration correction, but is computationally much cheaper. This technique was first used to discover PSR J1807–2459, a 1.7 h binary in NGC 6544 (Ransom et al. 2001).

##### 6.2.2.2 Stack/slide searches

(2004)) it offers a considerable improvement over the standard search. An excellent example is the recent discovery of the 7.7 hr binary pulsar J1756–2251 (Faulkner et al. 2004). This highly relativistic system was completely missed in the standard search analyses and only detectable as a result of the stack/slide technique.

##### 6.2.2.3 Phase-modulation searches
For orbital periods comparable to, or much less than, the integration time, the use of one-dimensional acceleration searches is clearly far from optimal, since the orbital motion can no longer be approximated as $V_l(t) = a_l t$. Although acceleration derivatives can be added to the search, this soon becomes computationally prohibitive. As an alternative approach, Jouteux et al. (2002) and Ransom et al. (2003a) developed a ‘phase-modulation search’ which becomes optimal when the observation encompasses several complete orbits. This is often the case for globular cluster searches with typical integration times of 2–10 h. The phase-modulation search utilises the fact that the amplitude or power spectrum of an observation covering several orbits of a binary system has a characteristic shape imprinted by the constantly changing signal frequency. A high S/N example of this is shown in Figure 6.10(a). Ransom et al. (2003a) demonstrated that the imprint can be described by a family of regularly spaced Bessel functions forming a set of sidebands about the spin frequency of the pulsar. The beauty of this result is that the spacing of the sidebands is simply the orbital period. A straightforward DFT of the region of interest will detect the orbital period (Figure 6.10(c)). Just like the search for signals in the time domain, the DFT is an extremely sensitive means of detecting the periodicity in the sidebands, even when they are not readily apparent (as shown in Figure 6.10(b) and (d)). Once the orbital period is known, the orbital semi-major axis and epoch of ascending node can be determined from the width and phases of the sidebands. For weak pulsars, this often requires specialised techniques to make full use of the phase information of the Fourier components. If the orbit is circular, these three parameters can be used by the correlation technique to determine the appropriate template to recover the power as before. Full details of this procedure can be found in Ransom et al. (2003a). A number of current searches of globular clusters are now routinely utilising the phase-modulation technique and may perhaps soon break the 96-min record held for the shortest radio pulsar binary (Camilo et al. 2000b).

Fig. 6.10. (a) Power spectrum of an 8 h observation of PSR J0023–7203J in the globular cluster 47 Tucanae. (b) Power spectrum of simulated data for a weak 2 ms pulsar in a 50 min orbit about a 0.2 M¯ companion. (c) FFT of the shaded region in (a) showing the expected modulation at the 2.9 h orbital period of the pulsar. (d) FFT of the shaded region in (b) showing the 50 min orbital period and two harmonics. Figure provided by Scott Ransom.

![Fig. 6.10](/book/ch6/fig-6-10.png)

##### 6.2.2.4 Dynamic power spectrum search
The various acceleration techniques discussed so far perform optimally for distinct ranges of orbital periods relative to integration time, T . For systems with orbital periods greater than a few times T , coherent one-dimensional acceleration searches (either in the time or frequency domain) usually are adequate. When computational demands are large, and some loss of sensitivity can be tolerated, the stack/slide approach also performs well. When the orbital period is significantly less than T , phase modulation techniques provide a very efficient means of detecting ultra-compact systems. In between the two extremes, there is something of a ‘sensitivity gap’ to pulsars with orbital periods of the order of T . A promising means of filling this gap is the ‘dynamic power-spectrum’ search. As in the stack/slide search, the time series is split into a num-

ber of smaller contiguous segments which are Fourier-transformed separately. The individual power/amplitude spectra can be summed harmonically and plotted as a two-dimensional (frequency versus time) image. Orbitally modulated pulsar signals appear as sinusoidal signals in this plane (as shown in Figure 6.11).

Fig. 6.11. Dynamic power spectra showing two recent pulsar discoveries in the globular cluster M62 showing fluctuation frequency as a function of time. Figure and analysis provided by Adam Chandler.

![Fig. 6.11](/book/ch6/fig-6-11.png)

This technique has been used by various groups where spectra are inspected visually (see, for example, Lyne et al. (2000)), or transformed into a another representation, e.g. using the Hough transform (Aulbert 2004). Recently, Chandler (2003) has developed a hierarchical scheme for searching these spectra that removes some of the human intervention. This was recently applied to a search of the globular cluster M62 resulting in the discovery of three new pulsars shown in Figure 6.11. One of the new discoveries – M62F, a faint 2.3 ms pulsar in a 4.8 h orbit, was detectable only using the dynamic power spectrum technique.

### 6.3 Searching for pulsars in the time domain

While the frequency domain techniques described above generally are the most effective and efficient means to find pulsars, there are alternative approaches based in the time domain. Originally developed in the late 1960s, time-domain techniques (fast-folding and single-pulse algorithms) are becoming increasingly popular additions in modern analyses that seek to maximise the volume of phase space covered in pulsar searches.

#### 6.3.1 Fast folding analyses
An essential procedure to check the validity of any good pulsar candidate is to fold2 the de-dispersed data modulo the candidate period and examine the resulting pulse profile. This suggests that an alternative means of finding pulsars is to fold each de-dispersed time series modulo many different trial periods and look for statistically significant pulse profiles. Such a simple approach would be extremely effective were it not for the fact that the computational power required to fold over all possible periods of interest is enormous. If, however, we can restrict the search to a limited range of periods then folding provides an attractive alternative to the standard Fourier-based algorithms described above. Shortly after the development of the FFT, Staelin (1969) devised a clever algorithm that avoids the many redundant operations involved in simple folding analyses. The ‘fast-folding algorithm’ (FFA) works by dividing a time series Tj of N samples into contiguous groups of n samples chosen such that N/n is an integer power of 2. The simplest folding of these data is at a period P0 that is n times the data sampling interval, i.e. $P_0 = n t_{\mathrm{samp}}$ . The folded profile p then consists of n bins, where the k th bin is simply

$$
p_k = \sum_{j=0}^{N/n-1} T_{k+jn}\tag{6.19}
$$

The FFA works by splitting this summation into log2 n stages which can be combined in different ways to fold the data at n slightly different periods. The scheme is best understood with the simple example shown in Figure 6.12 when $N = 16$ and $n = 4$. In this case, there are two stages at which the data are summed to produce four pulse profiles. At each stage, groups of samples are combined with a variable number of time sample shifts between each group. The resulting products represent the accumulated pulse profiles over the appropriate fraction of integration. For example, after the first of the two stages in Figure 6.12, the profiles represent the folded data over half of the integration. Repeating the FFA procedure over a range of combinations of N and n results in a range of P0 values that can be searched. The results are best displayed in a periodogram that shows a figure of merit for each folded pulse profile (e.g. reduced $\chi^2$ or S/N; see Chapter 7) versus folding

2 The folding procedure is described in detail in Chapter 7.

Folding Input data                      Processing step                  Output data period: A 1+5+   2+6+ 3+7+ 4+8+ 1        2        3        4        1 + 5 2 + 6 3 + 7 4 + 8                                       4 0                             0   9+13   10+14 11+15 12+16

B 1+5+ 2+6+ 3+7+        4+8+ 5        6        7        8 1 + 6 2 + 7 3 + 8 4 + 5   1                                  4 1/3 10+14 11+15 12+16     9+13

C 1+6+ 2+7+ 3+8+        4+5+ 9        10       11       12       9 +13 10+14 11+15 12+16   1                                  4 2/3 0                                 10+15 11+16 12+13     9+14

D 1                             2   1+6+ 2+7+     3+8+    4+5+ 13       14       15       16       9 +14 10+15 11+16 12+13                                       5 11+16 12+13   9+14    10+15

A        B        C        D

Fig. 6.12. Schematic representation of the fast-folding algorithm applied to a sixteen sample time series that is optimally folded at four different trial periods. Figure provided by Bernd Klein.

![Fig. 6.12](/book/ch6/fig-6-12.png)

$$
P_l = P_0 + l\,t_{\mathrm{samp}}\,\frac{n+1}{N}\tag{6.20}
$$

Fig. 6.13. Periodogram output from an FFA showing S/N as a function of trial folding period for an observation of the 8.5 s pulsar J2144–3933. The most significant peak occurs at the pulsar’s true period. Most FFT-based codes enforce a long-period cutoff at around 5 s in order to minimise the effects of red noise in the Fourier domain. This results in the detections of sub-harmonics which are less significant, as shown here.

![Fig. 6.13](/book/ch6/fig-6-13.png)

Even with the efficiency of the FFA over simple folding, the high data sampling rates of current surveys mean that searching the entire

period range of de-dispersed time series is computationally expensive. The FFA can be used to good effect, however, in the search for longperiod (P > 2 s) pulsars. The standard FFT-based search means that the signals from such pulsars occupy only a small part of the Fourier spectrum at low frequencies. Due to the physical processes mentioned above, this typically can contain a large amount of red noise, which makes such signals hard to detect. Working in the time domain, the FFA reveals the long-period phase space in much greater detail. This is highlighted by Figure 6.13, which shows an FFA periodogram from an observation of the 8.5 s pulsar J2144–3933, the longest period pulsar so far known.

#### 6.3.2 Single-pulse searches
Throughout this chapter we have concentrated on techniques that find pulsars by virtue of their highly periodic nature. The radiation from some pulsars, however, can vary greatly in amplitude so that detectable pulses are not strictly periodic. In such cases, the techniques discussed so far cease to become effective. Indeed, by implicitly assuming an underlying periodicity, we may be selecting against the detection of an important part of the neutron star population. Two classes of pulsars for which this is known to be the case are the giant-pulse emitters, from which pulses with between 100 and 1000 times the mean pulse intensity are occasionally emitted, and the nulling pulsars that emit no pulses for extended periods of time (see Chapter 1). The best known giant-pulse emitter – the Crab pulsar – was first discovered through its giant pulses (Staelin & Reifenstein 1968). Many nulling pulsars that emit only a few pulses during an integration would not be detectable in a periodicity search. This was demonstrated by the discovery of J1918+08, a 2.1 s pulsar discovered by a single-pulse analysis of an Arecibo survey of the Galactic plane (Nice 1999). The pulsar was not detected in the original Fourier analysis of the data (Nice, Fruchter & Taylor 1995). Searching for single pulses in a time series is basically an exercise in matched filtering. Given a time series of predominantly Gaussian noise of known mean and standard deviation, we seek individual events that deviate by several standard deviations from the mean. Consider a rectangular pulse of amplitude Speak and width W . For the optimal case when W is equal to the sampling time tsamp , it can be shown (Cordes

& McLaughlin 2003) that the S/N ratio of the pulse

$$
\mathrm{S/N} = \frac{S_{\mathrm{peak}} W}{S_{\mathrm{sys}}}\sqrt{\frac{n_p\,\Delta f}{W}}\tag{6.21}
$$


$$
n(>\mathrm{S/N}_{\min}) \sim 2 n_{\mathrm{samples}}\int_{\mathrm{S/N}_{\min}}^{\infty} \exp(-x^2)\,dx\tag{6.22}
$$

where nsamples is the number of samples in the time series. Requiring that n < 3 usually leads to $\mathrm{S/N}_{\min} = 4$. In practice, however, radio frequency interference (Section 6.4) usually increases the number of false detections so that a more practical S/N threshold might be 5–6. Figure 6.14 shows the single pulse search applied to data from the Parkes multibeam survey. As well as a clear excess of low DM pulses caused by interference, an excess at a DM of 223 cm−3 pc is also apparent. No signal was seen in the periodicity search at this DM. Subsequent observations at the same position showed these pulses to have an underlying periodicity of 871 ms and confirmed the existence of a new pulsar J1624–4616. This is one of a number of new pulsars to be confirmed in this way and demonstrates the effectiveness of the single pulse search as a complementary strategy to periodicity searches. Given the simplicity of the algorithm and relatively modest additional computational requirements of a single pulse search, it should soon become a standard part of the pulsar searching procedure.

### 6.4 Radio frequency interference

Fig. 6.14. Example output from a single pulse search of data from the Parkes multibeam survey. The top plots show the S/N distribution of the detected pulses, the number of pulses as a function of trial DM as well as S/N as a function of DM. The lower plot shows the individual dispersed pulses as a function of time. The size of the symbols is proportional to the pulse S/N. In addition to the presence of dispersed pulses from, in this case, PSR J1624– 4616, persistent interference at low DMs is also apparent. Figure and analysis provided by Maura McLaughlin.

![Fig. 6.14](/book/ch6/fig-6-14.png)

Even in the remote areas where most radio telescopes are located, terrestrial sources of radio frequency interference (RFI) can have a significant impact on our ability to detect pulsars close to the nominal sensitivity limits of the search. Most search codes have a limit to the number of candidates stored from the analysis. If a particular observation contain-

ing a pulsar is affected badly by RFI, the pulsar may not be strong or persistent enough to be saved as a candidate. Apart from electrical storms (which can saturate the receiver) the main interference problem arises from persistent broadband signals that mimic the periodic and sometimes even dispersed nature of pulsars. Such sources arise predominantly from nearby electrical devices (the mains power line AC frequency usually is detectable) and communications systems such as airport radar systems. Potential sources of RFI at the observatory, such as desktop computers (which now have clock speeds high enough to radiate in the radio band), also need to be monitored. Fortunately, since most sources of RFI are not dispersed they are detectable in the FFT of the zero-DM time series. Two main approaches to excising these unwanted signals are carried out: time domain clipping and frequency domain masking.

#### 6.4.1 Time domain clipping
Since most searches are expecting to find weak sources, sporadic bursts of interference represent an unwelcome intrusion on the time series. Such samples can be identified easily by comparing them with the expected mean and standard deviation of the zero-DM time series. As an example, a 1-bit filterbank (see Chapter 5) with nchans channels produces time series with an expected mean and standard deviation of nchans /2 and √ nchans /2, respectively. A sample is deemed unsuitable for analysis if it differs from the mean value by more than two standard deviations. In such cases, each of the nchans channels are set to zero (‘clipped’) to exclude them from influencing all subsequent analyses. Keeping a count of the number of independent samples provides a measure of how badly effected the data are. If this becomes a significant fraction of the total number of samples (e.g. 20 per cent easily can be reached during a bad electrical storm) the observation should be repeated on a subsequent date. This simple procedure is important for time domain analyses like the FFA, particularly for long-period pulsars, in which the integrated profiles can be significantly biased by sporadic RFI.

#### 6.4.2 Frequency domain masking
Most pulsar surveys collect many hundreds or even thousands of observations with the telescope pointing at different parts of the sky. The key

signature of RFI is that it will occur frequently and is independent of sky position. In some cases, the signal is seen predominantly when the telescope is pointing toward the source of the source of RFI, e.g. the local airport! Analysing a large number of zero-DM time series from observations of widely spaced sky positions will show persistent RFI sources occurring at the same frequencies in many or even all of the observations. Usually some sort of conservative threshold is placed, e.g. a signal will be considered to be RFI if it occurs in at least ten out of a hundred independent positions with S/N > 7. This analysis takes place usually on a convenient block of observations, e.g. all those taken in a single observing session or saved to the same magnetic tape. Based on the list of RFI signals that trigger the occurrence threshold, a spectral ‘mask’ is created. This simply is a list of all Fourier bin numbers corresponding to each RFI frequency. The mask then is applied to all subsequent processing by flagging the relevant Fourier bins so that they are ignored by the analysis software. The spectral mask is an efficient and effective method of RFI excision. A typical mask usually will require less than 1 per cent of all spectral bins to be ignored. While this does leave a small chance that a pulsar with a frequency coincident with a zero-DM RFI signal could be excised from the analysis, masking usually allows data to be analysed that would be otherwise swamped with candidate signals of RFI origin.

### 6.5 Pulsar search strategies
Having described the various search techniques in use, we now conclude with a brief discussion of the most profitable search strategies. As we shall see, how a pulsar survey is designed determines to a large extent what type of objects are found. It is important to bear in mind the lessons learnt from previous experiments when planning new ones.

#### 6.5.1 Searches close to the plane of our Galaxy
Young pulsars are most likely to be found near to their place of birth, close to the Galactic plane. This is the target region of one of the Parkes multibeam (PM) surveys and has already resulted in the discovery of over 700 new pulsars, almost half the number currently known. Such a large haul inevitably results in a number of interesting individual objects such as: PSR J1141−6545, a young pulsar in a relativistic 4 h orbit around a white dwarf (Kaspi et al. 2000b); PSR J1740−3052, a young

pulsar orbiting an ∼> 11 M star (Stairs et al. 2001); several intermediate ¯ mass binary pulsars and two double neutron star systems. For a review on this survey and its major discoveries, see Manchester (2001). Due to the severe propagation and sky background effects on the sensitivity at low frequencies (< 1 GHz), most Galactic plane surveys are now carried out in the 1–2 GHz band. The centre frequency of the Parkes multibeam system is 1.37 GHz. The generally high pulsar density along the Galactic plane means that deep searches like the PM survey are rewarded by a large yield. One reason for the depth of the PM survey is its relatively long integration time (35 min). While this is an ideal means to maximise the sensitivity to faint isolated pulsars, and those that null, the sensitivity to binary systems is compromised. In order to combat this, the PM survey applies a stack/slide acceleration search similar to that described in Section 6.2.2.2.

#### 6.5.2 All-sky searches for millisecond pulsars
The oldest radio pulsars form a virialised population of stars oscillating in the Galactic gravitational potential. The scale height for such a population is at least 500 pc, about 10 times that of the massive stars that populate the Galactic plane. Since the typical ages of millisecond pulsars are several Gyr or more, we expect, from our vantage point in the Galaxy, to be in the middle of an essentially isotropic population of nearby old and low-luminosity neutron stars. All-sky searches for millisecond pulsars at high Galactic latitudes have been very effective in probing this population. Much of the initial interest and excitement in this area was started at Arecibo when Wolszczan discovered two exciting pulsars at high latitudes: the double neutron star binary B1534+12 (Wolszczan 1991) and PSR B1257+12 (Wolszczan & Frail 1992), a millisecond pulsar with three orbiting planets. Surveys carried out at Arecibo, Parkes, Jodrell Bank and Green Bank by other groups in the 1990s found many other millisecond pulsars in this way. Since the interstellar propagation effects (scattering and dispersion) are much less severe away from the Galactic plane, the optimal frequency for these surveys is less than 1 GHz to take advantage of the generally higher flux densities of pulsars at these frequencies (see Section 1.1.3) and the larger telescope beam widths (see Appendix 1). In addition, the short integration times necessary to cover a reasonable area of sky mean that the effects of binary acceleration are far less problematic than deep searches of the Galactic plane.

#### 6.5.3 Searches at intermediate Galactic latitudes

In order to probe more deeply into the population of millisecond and recycled pulsars than possible at high Galactic latitudes, Edwards et al. (2001) used the PM system to survey intermediate latitudes in the range 5◦ < |b| < 15◦ . Among the fifty-eight new pulsars discovered, eight are relatively distant recycled objects, including two mildly relativistic neutron star-white dwarf binaries (Edwards & Bailes 2001). The success of this survey has lead to an extension of the search area by two groups. One of these surveys lead to the discovery of the double-pulsar binary system J0737–3039 (Burgay et al. 2003; Lyne et al. 2004).

#### 6.5.4 Targeted searches of supernova remnants

Ever since the discovery of pulsars, numerous deep surveys of supernova remnants for pulsations from young neutron stars have been carried out. With a few exceptions, these have been surprisingly unsuccessful. The main problem faced by these surveys has been the uncertain position of the putative pulsar, which could lie anywhere within, or around, the vicinity of its associated remnant. This positional uncertainty was quite often much larger than an individual telescope beam width (see Appendix 1) that therefore required a grid of pointings to cover properly the target area. Given that telescope time is always hard-fought, this ultimately leads to a compromise in sensitivity. This situation has, however, changed quite dramatically with the new generation of X-ray telescopes such as the Chandra observatory revealing point-like X-ray emission from within a number of Galactic supernova remnants. These observations suggest strongly the presence of the young neutron star associated with the supernova explosion and, for the first time in most cases, localise the position of the neutron star candidate to sub-arcsecond precision. A number of searches by Camilo and collaborators (see Camilo (2003) for a review) have utilised these positions to carry out very deep searches for pulsations. So far, four young, < 3000 yr old neutron stars have been discovered in these searches. Perhaps not surprisingly, these are all extremely faint objects that are well below the detection threshold of current large-scale surveys. Currently a significant effort is being made to systematically search the known neutron star point sources as deeply as possible.

#### 6.5.5 Targeted searches of globular clusters
Globular clusters have long been known as breeding grounds for millisecond and binary pulsars. The main reason for this is the high stellar density in globular clusters relative to most of the rest of the Galaxy. As a result, low-mass X-ray binaries are almost 10 times more abundant in clusters than in the Galactic disk. In addition, exchange interactions between binary and multiple systems in the cluster can result in the formation of exotic binary systems. Since a single globular cluster usually fits well within a single telescope beam, deep targeted searches can be made without the positional uncertainty that plagued earlier supernova remnant searches. In addition, once the DM of a pulsar is known in a globular cluster, the DM parameter space for subsequent searches essentially is fixed. This allows computation power to be invested in acceleration searches for short-period binary systems. Multiple observations of clusters also benefit from the occasional boosting of otherwise weak pulsars due to scintillation. To date, searches have revealed eighty pulsars in twenty-four globular clusters. Highlights include the double neutron star binary in M15 (Prince et al. 1991), and a low-mass binary system with a 96 min orbital period in 47 Tucanae, one of over twenty millisecond pulsars currently known in this cluster alone (Freire et al. 2003). On-going surveys of other clusters continue to yield new discoveries (see, for example, Possenti et al. (2003)). It is worth pointing out in this regard that the periodicity searches discussed above do not require any special modification to detect multiple signals in the time series, i.e. provided that the signals are above the noise threshold, the pulsars do not ‘interfere’ with one another.

#### 6.5.6 Searches of the Galactic centre region
A blank spot on the Galactic map of pulsar discoveries has been the Galactic centre region. Not a single radio pulsar has been found in the inner 500 pc around Sgr A∗ . This is in contrast to the large population of massive stars expected in this region, which is believed to be a site of past and current star formation (see, for example, Mezger et al. (1999)). Due to the extreme environment of the Galactic centre (i.e. tidal forces, magnetic field pressure, high gas densities, high temperatures and turbulences) it is believed that the initial mass function should be peaked at a higher mass than in the Galactic disk. This favours more massive

stars probably created by externally triggered star formation (e.g. compression of clouds via collisions). Such massive stars are indeed observed (see, for example, Figer et al. 1999). The increase in the relative importance of high-mass star formation toward the Galactic centre als leads naturally to the expectation of a much larger number density of neutron stars and stellar black holes in comparison to the disk. Moreover, the remnants of massive stars have been detected in the form of supernova remnants (Ekers et al. 1983; Kassim & Frail 1996) and possibly neutron stars (Muno et al. 2003). Therefore we can expect to find a population of pulsars that would be extremely useful in probing the Galactic centre and its conditions (Kramer et al. 1996a; Cordes & Lazio 1997): their number and age distribution would probe the past star formation history (Hartmann 1995); their period derivatives can constrain the gravitational potential in the Galactic centre (see Chapter 8); pulsar timing would enable us to probe the space-time around the super-massive black hole in the Galactic centre due to a variety of relativistic effects (Wex & Kopeikin 1999). The high stellar density of the Galactic centre makes it, like the globular clusters, a possible site of a millisecond pulsar orbiting a stellar-mass black hole. A recent summary can be found in Pfahl and Loeb (2004). The potential rewards for finding a pulsar in the Galactic centre are high, and searches have been performed. The large distance of ∼ 8 kpc to the Galactic centre means that large-area surveys are usually not sensitive enough. The PM survey did have the sensitivity, however, and was still, despite its tremendous success elsewhere, unsuccessful in this region. The reason for the difficulties of finding pulsars around Sgr A∗ is given by the large amount of interstellar scattering expected for Galactic centre pulsars (Cordes & Lazio 1997). The scattering is so severe that it renders all periodicity searches useless at frequencies below a few GHz. The only way to combat the effects of scattering – which has approximately an f −4 dependence (see Chapter 4) – is to search at higher frequencies. Such surveys have been attempted by Kramer et al. (1996a; 2000) and Klein (2004) at 4.85 GHz and for a number of selected point sources at 8.5 GHz by Klein (2004). However, increasing system temperatures and the steep spectrum of pulsars (see Chapter 1) worsen the prospects of finding a pulsar at high frequencies. Balancing such effects with the frequency dependence of scattering, Cordes and Lazio (1997) computed an optimal frequency for periodicity searches of Galactic centre pulsars, concluding that the best frequency would lie around 10 GHz. An updated analysis presented by Kramer et al. (2000)

is shown in Figure 6.15. At these optimal frequencies the telescope beam usually is too small to cover a large area, in particular for the large telescopes that are required to achieve a sufficient sensitivity. Cordes and Lazio (1997) therefore suggested to find pulsars in targeted searches of steep-spectrum polarised point-sources identified from imaging observations. Ultimately, the best prospects of finding Galactic centre pulsars will be with the Square Kilometre Array (SKA).

ξ=−0.5 ξ=−1.0 −1                ξ=−1.5 10                 ξ=−2.0 Scattered pulsed flux

ξ=−2.5 P=1.0 s −2 δ=0.05

−3

−4 1                             10 Frequency (GHz)

Fig. 6.15. Relative scattered pulsed flux that would be picked up by a periodicity search for a 1 s pulsar in the Galactic centre. Scattering is so severe that it renders the 50 ms wide pulse undetectable at low frequencies. At high frequencies the pulsar spectrum, here shown for various spectral indices ξ, dominates. The optimal search frequencies lies at about 10 GHz.

![Fig. 6.15](/book/ch6/fig-6-15.png)

#### 6.5.7 Searches with the Square Kilometre Array
All the surveys that have been conducted in the past or will be conducted in the next few years appear to be only the prelude to what will be possible with the future SKA. As for other areas in modern astronomy, the SKA will revolutionise the field of pulsar astrophysics. Not only will new science be made possible by the sheer number of pulsars discovered,

but also by the unique timing precision achievable with the SKA. The special property of the SKA will be its unique sensitivity. Current design figures indicate that a 1.5 µJy source will be detectable with $\mathrm{S/N} = 8$ in a 1 min integration. This will enable not only the discovery of most pulsars in the Milky Way but also allow present-day survey sensitivities to pulsars in the closest galaxies. With the single-pulse search techniques described in Section 6.3.2, it should be possible to detect giant pulses from pulsars as distant as the Virgo cluster. Pulsar surveys with the SKA essentially could discover all pulsars in our Galaxy that are beaming toward the Earth. From a simulation of a hypothetical all-sky SKA survey we estimate that between 10 000 and 20 000 pulsars, including over 1 000 millisecond pulsars, could be discovered. This impressive yield also samples effectively every possible outcome of the evolution of massive binary stars, thereby guaranteeing the discovery of very exciting systems. Since the integration times of these surveys will be short (5 min or less), compact binaries should be relatively simple to detect. As a result, we expect at least a hundred compact relativistic binaries, including the elusive pulsar–black hole systems. The search, discovery and study of such systems is one of the main science drivers of the SKA.

### 6.6 Further reading
Although a large number of articles on pulsar searching have been written over the years, we have attempted in this chapter to bring together the various techniques in a single resource. For the reader wishing to gain a deeper insight into the underlying mathematical and signal processing issues discussed throughout this chapter, the excellent text books Numerical Recipes: The Art of Scientific Computing (Press et al. 1992) and The Fourier Transform and its Applications (Bracewell 1998) are highly recommended. Nowadays, a large number of reliable FFT routines are freely available. Press et al. (1992) provide an excellent discussion of why the FFT is so much faster than a DFT, and provide some excellent subroutines in a number of languages. Perhaps the best of the publicly available set of FFT tools is the fftw library (www.fftw.org), which is not restricted by the usual power of 2 length requirements. Early work on pulsar search methodologies was summarised by Burns and Clark (1969) and Hankins and Rickett (1975). An excellent introduction to pulsar searching also can be found in the review by Bhat-

tacharya (1998). Further discussions of the two-dimensional Fourier transform search can be found in Lyne and Smith (2005). Two seminal papers (Ransom et al. 2002; 2003a) contain excellent discussions on Fourier domain search techniques. Many of the results quoted in Sections 6.1.3 and 6.2 were developed or discussed in detail for the first time in these papers. Further discussion on the phase-modulation search technique can be found in Jouteux et al. (2002). The single-pulse search methods described by Cordes and McLaughlin (2003) and McLaughlin and Cordes (2003) are highly recommended for those wishing to explore these techniques in more detail. A number of aspects concerning pulsar search design and optimisation not discussed here can be found in the excellent review by Cordes (2002). Camilo (1995; 1997; 1999) has written several reviews of pulsar surveys that are good starting points for further reading.

### 6.7 Available resources
While numerous pulsar search software packages have been developed over the years, only a few are freely available for use. Two currently available packages are PRESTO, developed by Scott Ransom, and SEEK developed by one of us (DRL). Both programs are well tested and have a complementary approach to pulsar searching in the Fourier domain. PRESTO makes full use of the phase information and can be used to carry out sophisticated acceleration and phase modulation searches for pulsars. To date it has been used to great success by Ransom and collaborators (Ransom et al. 2003b). SEEK closely follows the standard search approach and has been used successfully in a wide range of different projects. Also incorporated into the package are time domain resampling routines to carry out acceleration searches (used to great effect in searches of 47 Tucanae; see Camilo et al. (2000b)) as well as the singlepulse search routines developed by Cordes and McLaughlin (2003). Peter Müller has written an FFA program that has been adapted by one of us (MK) for general use in pulsar searches. Links to all of the above programs and sample data sets that can be used as starting-points for those wishing to develop and test their own software can be found on the book web site, (see Appendix 3).